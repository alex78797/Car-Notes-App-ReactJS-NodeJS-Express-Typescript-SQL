CREATE TABLE "users" (
 	"userId" uuid default gen_random_uuid(),
 	"email" VARCHAR unique not null,
 	"password" VARCHAR not null,
	"userName" VARCHAR unique not null,
 	"roles" VARCHAR[] not null default array[]::VARCHAR[],
	"createdAt" TIMESTAMPTZ default now(),
	PRIMARY KEY ("userId")
);

CREATE TABLE "tokens" (
 	"tokenId" uuid default gen_random_uuid(),
 	"refreshToken" VARCHAR unique not null,
	"userId" uuid not null,
	"createdAt" TIMESTAMPTZ default now(),
	PRIMARY KEY ("tokenId"),
	CONSTRAINT fk_users
		FOREIGN KEY ("userId") REFERENCES "users"("userId")
		ON DELETE CASCADE
);


CREATE TABLE "cars" (
 	"carId" uuid default gen_random_uuid(),
	"userId" uuid not null,
 	"brand" VARCHAR not null,
 	"model" VARCHAR not null,
 	"fuel" VARCHAR not null,
	"createdAt" TIMESTAMPTZ default now(),
	PRIMARY KEY ("carId"),
	CONSTRAINT fk_users
		FOREIGN KEY ("userId") REFERENCES "users"("userId")
		ON DELETE CASCADE
);

