import { Services } from "@Common/infrastructure/Services";
import { HttpClient } from "@Common/client/HttpClient";
import { GameListDto } from "@Common/dto/GameListDto";

export class GamesApiClient extends HttpClient {

    private readonly apiUrl = "/game";

    constructor(services: Services) {
        super(services, services.settings.gameServerUrl);
    }

    public getMyGames(): Promise<GameListDto[]> {
        var url = `${this.apiUrl}/MyGames`;
        return this.get<GameListDto[]>(url);
    }

    public getOpenGames(): Promise<GameListDto[]> {
        var url = `${this.apiUrl}/PublicGames`;
        return this.get<GameListDto[]>(url);
    }

    public createGame(): Promise<GameListDto> {
        var url = `${this.apiUrl}/CreateGame`;
        return this.post(url);
    }

    public updateGameMetadata(dto: GameListDto): Promise<GameListDto> {
        var url = `${this.apiUrl}/REST/${dto.id}`;
        return this.patch(url, dto);
    }

    public deleteGame(id: string): Promise<GameListDto> {
        var url = `${this.apiUrl}/REST/${id}`;
        return this.delete(url);
    }
}
