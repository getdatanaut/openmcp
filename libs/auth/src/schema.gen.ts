/* eslint-disable */

import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
					id: text('id').primaryKey(),
					name: text('name').notNull(),
 email: text('email').notNull().unique(),
 emailVerified: boolean('email_verified').notNull(),
 image: text('image'),
 createdAt: timestamp('created_at').notNull(),
 updatedAt: timestamp('updated_at').notNull()
				});

export const userSessions = pgTable("user_sessions", {
					id: text('id').primaryKey(),
					expiresAt: timestamp('expires_at').notNull(),
 token: text('token').notNull().unique(),
 createdAt: timestamp('created_at').notNull(),
 updatedAt: timestamp('updated_at').notNull(),
 ipAddress: text('ip_address'),
 userAgent: text('user_agent'),
 userId: text('user_id').notNull().references(()=> users.id, { onDelete: 'cascade' })
				});

export const userAccounts = pgTable("user_accounts", {
					id: text('id').primaryKey(),
					accountId: text('account_id').notNull(),
 providerId: text('provider_id').notNull(),
 userId: text('user_id').notNull().references(()=> users.id, { onDelete: 'cascade' }),
 accessToken: text('access_token'),
 refreshToken: text('refresh_token'),
 idToken: text('id_token'),
 accessTokenExpiresAt: timestamp('access_token_expires_at'),
 refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
 scope: text('scope'),
 password: text('password'),
 createdAt: timestamp('created_at').notNull(),
 updatedAt: timestamp('updated_at').notNull()
				});

export const authVerifications = pgTable("auth_verifications", {
					id: text('id').primaryKey(),
					identifier: text('identifier').notNull(),
 value: text('value').notNull(),
 expiresAt: timestamp('expires_at').notNull(),
 createdAt: timestamp('created_at'),
 updatedAt: timestamp('updated_at')
				});

export const oauthApplication = pgTable("oauth_application", {
					id: text('id').primaryKey(),
					name: text('name'),
 icon: text('icon'),
 metadata: text('metadata'),
 clientId: text('client_id').unique(),
 clientSecret: text('client_secret'),
 redirectURLs: text('redirect_u_r_ls'),
 type: text('type'),
 disabled: boolean('disabled'),
 userId: text('user_id'),
 createdAt: timestamp('created_at'),
 updatedAt: timestamp('updated_at')
				});

export const oauthAccessToken = pgTable("oauth_access_token", {
					id: text('id').primaryKey(),
					accessToken: text('access_token').unique(),
 refreshToken: text('refresh_token').unique(),
 accessTokenExpiresAt: timestamp('access_token_expires_at'),
 refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
 clientId: text('client_id'),
 userId: text('user_id'),
 scopes: text('scopes'),
 createdAt: timestamp('created_at'),
 updatedAt: timestamp('updated_at')
				});

export const oauthConsent = pgTable("oauth_consent", {
					id: text('id').primaryKey(),
					clientId: text('client_id'),
 userId: text('user_id'),
 scopes: text('scopes'),
 createdAt: timestamp('created_at'),
 updatedAt: timestamp('updated_at'),
 consentGiven: boolean('consent_given')
				});
