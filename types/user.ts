import { type JwtPayload } from "jsonwebtoken";
interface User extends JwtPayload {
    userName?: string,
    id?: string
}

export { type User };