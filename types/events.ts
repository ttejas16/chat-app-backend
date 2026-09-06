
interface MessageEventPayload {
    content: string,
    userId: string,
    userName: string,
    roomId: string,
    roomName: string,
    isGroup: boolean
}

interface TypingEventPayload {
    isTyping: boolean,
    userName: string
}

interface OnlineEventPayload {
    roomId: string,
    targetUserId: string
}

interface OnlineEventAcknowledgement {
    [key: string]: boolean
}

interface ClientToServerEvents {
    message: (message: MessageEventPayload) => void,
    "join-room": (roomId: string) => Promise<void>,
    "leave-room": (roomId: string) => void,
    online: (roomObjects: OnlineEventPayload[], f: (ack: OnlineEventAcknowledgement) => void) => void,
    typing: (payload: TypingEventPayload) => void
}

interface ServerToClientEvents {
    message: (message: MessageEventPayload) => void,
    notification: (message: MessageEventPayload) => void,
    typing: (payload: TypingEventPayload) => void,
    online: (roomId: string) => void,
    offline: (userId: string) => void,
}


// events that the socket-io client emits and server listens to them
enum clientEvents {
    MESSAGE = 'message',
    JOINROOM = 'join-room',
    LEAVEROOM = 'leave-room',
    ONLINE = 'online',
    TYPING = 'typing',

    // default socket-io events
    CONNECTION = 'connection',
    DISCONNET = 'disconnect'
}

// events that the socket-io server emits and the client listens to them
enum serverEvents {
    MESSAGE = 'message',
    NOTIFICATION = 'notification',
    TYPING = 'typing',
    ONLINE = 'online',
    OFFLINE = 'offline'
}

export {
    type MessageEventPayload,
    type TypingEventPayload,
    type OnlineEventPayload,
    type OnlineEventAcknowledgement,
    clientEvents,
    serverEvents,
    type ClientToServerEvents,
    type ServerToClientEvents
}