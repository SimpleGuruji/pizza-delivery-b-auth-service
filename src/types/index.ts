import { Request } from 'express'

export interface UserData {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
    tenantId?: number
}

export interface RegisterUserRequest extends Request {
    body: UserData
}

export interface LoginUserData {
    email: string
    password: string
}
export interface LoginUserRequest extends Request {
    body: LoginUserData
}

export type AuthCookie = {
    accessToken: string
    refreshToken: string
}

export interface AuthRequest extends Request {
    auth: {
        sub: string
        role: string
        id?: string
    }
}

export interface IRefreshTokenPayload {
    id: string
}

export interface ITenantData {
    name: string
    address: string
}

export interface TenantRequest extends Request {
    body: ITenantData
}

export interface LimitedUserData {
    firstName: string
    lastName: string
    role: string
}

export interface UpdateUserRequest extends Request {
    body: LimitedUserData
}
