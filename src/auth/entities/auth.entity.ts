export class AuthEntity {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    rolID: number;
    provincia?: string;
    metodoPago?: string;
  };
}