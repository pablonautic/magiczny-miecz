import { IResponseProcessor } from "@Common/events/IResponseProcessor";
import { Services } from "@Common/infrastructure/Services";
import { Game } from "@Common/mechanics/Game";
import { Event } from "@Common/events/Event";
import { CommonSerializer } from "@Common/mechanics/CommonSerializer";
import { Player } from "@Common/mechanics/Player";

export class EventHandlerContext {

    serializer: CommonSerializer;

    services: Services;

    responseProcessor: IResponseProcessor;

    game: Game;

    event: Event;

    callingPlayer: Player;
}
