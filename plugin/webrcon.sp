#pragma semicolon 1
#include <sourcemod>
#include <websocket>

#define PLUGIN_VERSION "1.0"

// The handle to the master socket
new WebsocketHandle:g_hListenSocket = INVALID_WEBSOCKET_HANDLE;

// An adt_array of all child socket handles
new Handle:g_hChilds;
new Handle:g_hChildsAuth;

new Handle:g_hCvarRconPassword = INVALID_HANDLE;
new Handle:g_hCvarSharedKey = INVALID_HANDLE;

public Plugin:myinfo =
{
	name = "Websocket rcon server",
	author = "icewind",
	description = "Create rcon connections using websockets",
	version = PLUGIN_VERSION,
	url = "http://spire.tf/"
}

public OnPluginStart()
{
	// Create the array
	g_hChilds = CreateArray();
	g_hChildsAuth = CreateArray();
	g_hCvarSharedKey = CreateConVar("sm_webrcon_key", "", "Key for webrcon connections", FCVAR_PROTECTED);
	g_hCvarRconPassword = FindConVar("rcon_password");
}

public OnAllPluginsLoaded()
{
	decl String:sServerIP[40];
	new longip = GetConVarInt(FindConVar("hostip"));
	FormatEx(sServerIP, sizeof(sServerIP), "%d.%d.%d.%d", (longip >> 24) & 0x000000FF, (longip >> 16) & 0x000000FF, (longip >> 8) & 0x000000FF, longip & 0x000000FF);

	// Open a new child socket
	if(g_hListenSocket == INVALID_WEBSOCKET_HANDLE)
		g_hListenSocket = Websocket_Open(sServerIP, 27021, OnWebsocketIncoming, OnWebsocketMasterError, OnWebsocketMasterClose);
}

public OnPluginEnd()
{
	if(g_hListenSocket != INVALID_WEBSOCKET_HANDLE)
		Websocket_Close(g_hListenSocket);
}

public Action:OnWebsocketIncoming(WebsocketHandle:websocket, WebsocketHandle:newWebsocket, const String:remoteIP[], remotePort, String:protocols[256])
{
	Format(protocols, sizeof(protocols), "");
	Websocket_HookChild(newWebsocket, OnWebsocketReceive, OnWebsocketDisconnect, OnChildWebsocketError);
	PushArrayCell(g_hChilds, newWebsocket);
	PushArrayCell(g_hChildsAuth, false);
	return Plugin_Continue;
}

public OnWebsocketMasterError(WebsocketHandle:websocket, const errorType, const errorNum)
{
	LogError("MASTER SOCKET ERROR: handle: %d type: %d, errno: %d", _:websocket, errorType, errorNum);
	g_hListenSocket = INVALID_WEBSOCKET_HANDLE;
}

public OnWebsocketMasterClose(WebsocketHandle:websocket)
{
	g_hListenSocket = INVALID_WEBSOCKET_HANDLE;
}

public OnChildWebsocketError(WebsocketHandle:websocket, const errorType, const errorNum)
{
	LogError("CHILD SOCKET ERROR: handle: %d, type: %d, errno: %d", _:websocket, errorType, errorNum);
	new i = FindValueInArray(g_hChilds, websocket);
	RemoveFromArray(g_hChilds, i);
	RemoveFromArray(g_hChildsAuth, i);
}

public OnWebsocketReceive(WebsocketHandle:websocket, WebsocketSendType:iType, const String:receiveData[], const dataSize)
{
	if(iType == SendType_Text)
	{
		new i = FindValueInArray(g_hChilds, websocket);

		if(GetArrayCell(g_hChildsAuth, i) != false) {
			decl String:output[8192];
			ServerCommandEx(output, sizeof(output), receiveData);

			if (strncmp(receiveData, "quit", 4) == 0) {
				CloseHandle(websocket);
			}

			Websocket_Send(websocket, SendType_Text, output);
		} else {
			decl String:password[128];
			GetConVarString(g_hCvarRconPassword, password, sizeof(password));
			if (strncmp(receiveData, password, strlen(password)) == 0) {
				SetArrayCell(g_hChildsAuth, i, true);
				Websocket_Send(websocket, SendType_Text, "authenticated");
			} else {
				// try the webrcon key
				GetConVarString(g_hCvarSharedKey, password, sizeof(password));
				if (strncmp(receiveData, password, strlen(password)) == 0 && strlen(password) > 0) {
					SetArrayCell(g_hChildsAuth, i, true);
					Websocket_Send(websocket, SendType_Text, "authenticated");
				} else {
					Websocket_Send(websocket, SendType_Text, "error: not authenticated");
				}
			}
		}
	}
}

public OnWebsocketDisconnect(WebsocketHandle:websocket)
{
	new i = FindValueInArray(g_hChilds, websocket);
	RemoveFromArray(g_hChilds, i);
	RemoveFromArray(g_hChildsAuth, i);
}
