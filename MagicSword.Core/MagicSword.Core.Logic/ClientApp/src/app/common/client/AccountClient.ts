import { HttpClient } from "@Common/client/HttpClient";
import { Services } from "@Common/infrastructure/Services";
import { UserDto } from "@Common/client/UserDto";
import { AuthResponse } from "@Common/client/AuthResponse";

export class AccountClient extends HttpClient {

    private controller = "Account";

    constructor(services: Services) {
        super(services, services.settings.authServerUrl);
    }

    public validateToken(token: string): Promise<UserDto> {
        return this.get<UserDto>(`/${this.controller}/ValidateToken?access_token=${token}`)
            .then(u => {
                u.id = u.id.toString(); //seems that in some cases a number is returned, but we want to stick to string
                return u;
            });
    }

    public login(email: string, password: string, rememberMe: boolean): Promise<AuthResponse> {
        return this.post<AuthResponse>(`${this.controller}/Login`, { email: email, password: password, rememberMe: rememberMe });
    }

    public register(email: string, password: string, nickname: string): Promise<AuthResponse> {
        return this.post<AuthResponse>(`${this.controller}/Register`, { email: email, password: password, nickname: nickname });
    }

}
