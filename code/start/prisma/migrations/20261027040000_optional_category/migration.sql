-- Match the optional category field in schema.prisma.
ALTER TABLE "Product" ALTER COLUMN "category" DROP NOT NULL;
