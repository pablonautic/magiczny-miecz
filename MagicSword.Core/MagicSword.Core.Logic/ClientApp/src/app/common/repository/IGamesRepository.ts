import {GameListDto} from "@Common/dto/GameListDto";

export interface IGamesRepository {

    getGame(id: string): Promise<any>;

    getMyGames(): Promise<GameListDto[]>;

    update(id: string, dto: any): Promise<string>;

    save(ownerId: string, dto: any): Promise<any>;

    createGame(ownerId: string): Promise<GameListDto>;
}
