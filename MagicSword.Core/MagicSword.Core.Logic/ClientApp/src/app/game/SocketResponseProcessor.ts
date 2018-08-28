﻿import * as socketIo from "socket.io";
import { IResponseProcessor } from "app/game/IResponseProcessor";
import { Services } from "app/Services";
import { Event } from "./Event";

export class SocketResponseProcessor implements IResponseProcessor {

    constructor(private services: Services, private io: SocketIO.Server, private socket: socketIo.Socket) {

    }

    registerCaller(event: Event) {
        this.services.logger.debug("Registering caller");
        this.socket.join(this.roomId(event.gameId));
    }

    respondCaller(event: Event) {
        event.token = null;
        this.services.logger.debug("Sending response to caller");
        this.services.logger.debug(event);

        this.socket.emit("NewEvent", event);
    }

    respondAll(event: Event) {
        event.token = null;
        this.services.logger.debug("Sending response to room");
        this.services.logger.debug(event);

        this.io.to(this.roomId(event.gameId)).emit('NewEvent', event);
    }

    private roomId(gameId: string) {
        return "Game_" + gameId;
    }
}