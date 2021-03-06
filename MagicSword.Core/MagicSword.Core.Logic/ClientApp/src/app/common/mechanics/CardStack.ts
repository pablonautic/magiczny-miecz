import { CardDefinition } from "@Common/mechanics/definitions/CardDefinition";
import { CardStackDefinition } from "@Common/mechanics/definitions/CardStackDefinition";
import { CardType } from "@Common/mechanics/definitions/CardType";
import { Collections } from "@Common/utils/Collections";
import { ActorBase } from "@Common/mechanics/ActorBase";
import { Card } from "@Common/mechanics/Card";
import { AttributeDefinition } from "@Common/mechanics/definitions/AttributeDefinition";


export class CardStack extends ActorBase {

    get name() { return this.definition.name; }
    get type() { return this.definition.type; }

    cards: Card[] = [];

    drawnCards: Card[] = [];

    disposedCards: Card[] = [];

    constructor(public definition: CardStackDefinition, private width: number, private height: number, private depth: number) {
        super();
    }

    buildStack() {
        if (!this.definition.cardDefinitions) {
            throw new Error("cardDefinitions not set");
        }

        for (var cardDefinition of this.definition.cardDefinitions) {
            for (let i = 0; i < cardDefinition.multiplicity; i++) {
                var card = this.createCardInternal(cardDefinition);
                this.cards.push(card);
            }
        }

        if (this.definition.eventLike) {
            this.shuffle();
        }
    }

    shuffle() {
        this.cards = Collections.shuffle(this.cards);
    }

    pushDisposedCards() {
        this.cards = this.cards.concat(this.disposedCards);
        this.disposedCards = [];
    }

    public createCard = (definitionId: number) => {
        var definition = this.findDefinition(definitionId);
        var card = this.createCardInternal(definition);
        return card;
    }

    private findDefinition = (definitionId: number) => {
        return this.definition.cardDefinitions.find(s => s.id === definitionId);
    }

    private createCardInternal = (cardDefinition: CardDefinition) => {

        var card = new Card(cardDefinition);
        card.originStack = this;

        if (this.definition.type === CardType.Character) {
            for (var def of AttributeDefinition.attributeDefinitions) {
                card.setAttribute(def.name, def.initialValue);
            }
        }

        return card;
    }

    public drawCard(card: Card = null, uncover: boolean): Card {

        if (card == null) {

            if (this.cards.length === 0) {
                return null;
            }

            card = this.cards.pop();
        }

        //a lazy way to override the lack of info on which substack are we drawning from
        this.cards = Collections.remove(this.cards, card);
        this.disposedCards = Collections.remove(this.disposedCards, card);

        //card.init();
        card.setCovered(!uncover);

        card.object3D.position.copy(this.object3D.position);
        card.object3D.position.x += this.width + 1;
        card.object3D.position.y = this.definition.type === CardType.Pawn ? this.width / 2 + 0.5 : 0.5;

        this.drawnCards.push(card);

        return card;
    }

    public disposeCard = (card: Card) => {
        this.drawnCards = this.drawnCards.filter(obj => obj !== card);
        if (this.definition.eventLike) {
            this.disposedCards.push(card);
        } else {
            this.cards.push(card);
        }
        //card.unload();
    }

    public cleanup = () => {
        this.cards = [];
        this.drawnCards = [];
        this.disposedCards = [];

        this.object3D.position.copy(this.definition.initialPosition);
        this.object3D.rotation.copy(this.definition.initialRotation);
    }

    public findCard(id: string) {
        return this.cards.find(a => a.id === id);
    }

    public findDrawnCard(id: string) {
        return this.drawnCards.find(a => a.id === id);
    }

    public findDisposedCard(id: string) {
        return this.disposedCards.find(a => a.id === id);
    }

    public findCardDeep(id: string) {
        var card = this.findCard(id);
        if (!card) {
            card = this.findDrawnCard(id);
        }
        if (!card) {
            card = this.findDisposedCard(id);
        }
        return card;
    }
}
