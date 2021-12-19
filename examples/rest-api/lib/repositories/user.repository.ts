import { User, Prisma, PrismaClient } from '@prisma/client';
import { Client } from 'lib/database/client';

export class UserRepository {
  private readonly client: PrismaClient = Client.connect();

  find<T extends Prisma.UserFindManyArgs>(query?: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>) {
    return this.client.user.findMany(query);
  }

  findOne<T extends Prisma.UserFindFirstArgs>(
    query?: Prisma.SelectSubset<T, Prisma.UserFindFirstArgs>,
  ): Promise<User | null> {
    return this.client.user.findFirst(query);
  }

  findById(id: number): Promise<User | null> {
    return this.client.user.findFirst({
      where: { id },
    });
  }

  create(newUser: Prisma.UserCreateInput): Promise<User> {
    return this.client.user.create({
      data: newUser,
    });
  }

  update(id: number, updateUser: Prisma.UserUpdateInput): Promise<User> {
    return this.client.user.update({
      data: updateUser,
      where: {
        id,
      },
    });
  }

  delete(id: number): Promise<User> {
    return this.client.user.delete({
      where: {
        id,
      },
    });
  }
}
