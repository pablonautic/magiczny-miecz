import { Event } from "@Common/events/Event";
import { StackShuffleRequestDto } from "@Common/events/stackshuffle/StackShuffleRequestDto";
import { CardStack } from "@App/game/logic/CardStack";
import { EventType } from "@Common/events/EventType";
import { ClientEventHandlerBase } from "@App/game/events/ClientEventHandlerBase";
import { StringUtils } from "@Common/utils/StringUtils";

export class StackShuffleClientEventHandler extends ClientEventHandlerBase {


    getEventType(): string {
        return EventType.StackShuffle;
    }

    shuffle(stack: CardStack) {
        var dto = new StackShuffleRequestDto();
        dto.stackId = stack.id;
        this.sendRequest(dto);
    }

    getMessage(event: Event): string {
        var dto = event.data as StackShuffleRequestDto;
        var stack = this.context.game.findActor(dto.stackId) as CardStack;
        if (stack) {
            return StringUtils.format(this.r(), this.senderName(event), stack.name);
        } else {
            return event.eventType + " " + "error";
        }
    }

}

