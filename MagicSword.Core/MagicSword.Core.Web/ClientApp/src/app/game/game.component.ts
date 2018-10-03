import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";

import { Game } from "@App/game/Game";
import { Event } from "@Common/events/Event";
import { IActor } from "@App/game/logic/IActor";
import { Services } from "@App/Services";
import { CardStack } from "@App/game/logic/CardStack";
import { Card } from "@App/game/logic/Card";
import { SocketClient } from "@App/SocketClient";
import { ResourceManager } from "@App/game/ResourceManager";
import { ClientEventDispatcher } from "@App/game/events/ClientEventDispatcher";
import { Message } from "@App/game/Message";
import { EventKind } from "@Common/events/EventKind";
import { EventType } from "@Common/events/EventType";
import { GameStateDto } from "@Common/dto/GameStateDto";
import { ClientGameService } from "@App/game/local/ClientGameService";
import { AttributeDefinition } from "@Common/mechanics/definitions/AttributeDefinition";
import { StringUtils } from "@Common/utils/StringUtils";


@Component({
    selector: "app-game",
    templateUrl: "./game.component.html",
})
export class GameComponent implements AfterViewInit {

    @ViewChild("viewport", { read: ElementRef }) viewport: ElementRef;
    @ViewChild("eventsPanel", { read: ElementRef }) eventsPanel: ElementRef;

    game: Game;
    socketClient: SocketClient;
    dispatcher: ClientEventDispatcher;
    clientGameService: ClientGameService;

    chatMessage = "";

    get selectedActor(): IActor {
        return this.game ? this.game.world.selectedActor : null;
    }

    constructor(private modalService: NgbModal, private route: ActivatedRoute, private services: Services, private resourceManager: ResourceManager) {
        this.socketClient = new SocketClient(this.services);

    }

    messages: Message[] = [];
    cardsToPick: Card[] = [];
    attributes: AttributeDefinition[] = AttributeDefinition.attributeDefinitions;

    async ngAfterViewInit() {

        var consoleHandler = this.services.logger.createDefaultHandler();
        var myHandler = (messages, context) => {
            if (context.level.value >= 2) { //INFO
                var message = new Message();
                message.text = messages[0];
                this.addMessage(message);
            }
        };

        this.services.logger.setHandler((messages, context) => {
            consoleHandler(messages, context);
            myHandler(messages, context);
        });

        await this.resourceManager.load();

        var mode = "local";
        if (location.pathname.indexOf("/online/") > 0) {
            mode = "online";
        }

        this.route.paramMap.subscribe(d => {
            var gameId = d.get("gameId");
            this.startGame(gameId, mode);
        });
    }

    private startGame(gameId: string, mode: string) {

        this.game = new Game(this.viewport.nativeElement, this.services);
        this.game.id = gameId;

        this.dispatcher = new ClientEventDispatcher(this.services, this.game);
        this.game.eventDispatcher = this.dispatcher;

        this.services.inboundBus.of().subscribe(e => {
            this.dispatcher.process(e);
            if (e.eventKind === EventKind.Notification) {
                var message = this.eventToMessage(e);
                this.addMessage(message);
            }
            if (e.eventKind === EventKind.Response && e.eventType === EventType.JoinGame) {

                var rdto = e.data as GameStateDto;
                for (var event of rdto.notificationEvents) {
                    var message2 = this.eventToMessage(event);
                    this.addMessage(message2, false);
                }
                this.scrollEventsPanel();
            }
        });

        switch (mode) {
            case "local":
                this.clientGameService = new ClientGameService(this.services);
                this.services.outboundBus.of().subscribe((e: Event) => {
                    this.clientGameService.handleEvent(e);
                });
                this.dispatcher.joinGameHandler.request();
                break;
            case "online":
                this.socketClient.init();
                this.dispatcher.joinGameHandler.request();
                break;
            default:
                throw new Error("unknown mode: " + mode);
        }
    }

    private eventToMessage(event: Event) {
        var message = new Message();
        message.text = this.dispatcher.getMessage(event);
        return message;
    }

    private addMessage(message: Message, scrollDown = true) {
        this.messages.push(message);
        if (scrollDown) {
            this.scrollEventsPanel();
        }
    }

    private scrollEventsPanel() {
        var div = this.eventsPanel.nativeElement as any;
        setTimeout(() => {
            div.scrollTop = div.scrollHeight;
        }, 200);
    }

    toggleAttribute(attribute: AttributeDefinition) {
        var card = this.selectedActor as Card;
        this.dispatcher.cardSetAttributeClientEventHandler.toggleAttribute(card, attribute.name);
    }

    attrDdText(attribute: AttributeDefinition) {
        var card = this.selectedActor as Card;
        if (!card || !card.isCard) {
            return "";
        }
        var attr = card.getAttribute(attribute.name);
        var msg = this.res(attr ? "attribute_remove" : "attribute_give");
        return StringUtils.format(msg, this.res(attribute.name));
    }

    sendMessage() {
        if (!this.chatMessage || this.chatMessage.length === 0) {
            return;
        }
        this.dispatcher.playerMessageClientEventHandler.sendMessage(this.chatMessage);
        this.chatMessage = "";
    }

    drawCard(uncover: boolean = false) {
        this.dispatcher.drawCardHandler.drawCard(uncover);
    }

    disposeCard() {
        var card = this.selectedActor as Card;
        this.dispatcher.disposeCardClientEventHandler.disposeCard(card);
    }

    diceThrow() {
        this.dispatcher.diceThrowClientEventHandler.throwDice();
    }

    shuffleStack() {
        var stack = this.selectedActor as CardStack;
        this.dispatcher.stackShuffleClientEventHandler.shuffle(stack);
    }

    putBackDisposed() {
        var stack = this.selectedActor as CardStack;
        this.dispatcher.stackPushDisposedCardsClientEventHandler.putCards(stack);
    }

    res(key: string) {
        return ResourceManager.getLocalizationMessage(key);
    }

    async viewCards(content) {
        var stack = this.selectedActor as CardStack;
        var cards = await this.dispatcher.viewStackHandler.viewCards(stack);
        this.showModal(content, cards);
    }

    async viewDisposedCards(content) {
        var stack = this.selectedActor as CardStack;
        var cards = await this.dispatcher.viewStackHandler.viewDisposedCards(stack);
        this.showModal(content, cards);
    }

    private showModal(content, cards: Card[]) {
        this.cardsToPick = cards;
        this.modalService.open(content, { ariaLabelledBy: "modal-basic-title" }).result.then(async (result) => {
            this.dispatcher.pickCardClientEventHandler.pickCard(result);
            this.clearCards();
        }, cancelReason => {
            this.clearCards();
        });
    }

    private clearCards() {
        this.cardsToPick = [];
    }

}

