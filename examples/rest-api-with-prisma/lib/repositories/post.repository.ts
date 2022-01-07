import { PrismaClient, Prisma } from '@prisma/client';
import { Client } from 'lib/database/client';

export class PostRepository {
  readonly client: PrismaClient = Client.connect();

  find<T extends Prisma.PostFindManyArgs>(query?: Prisma.SelectSubset<T, Prisma.PostFindManyArgs>) {
    return this.client.post.findMany(query);
  }

  findOne<T extends Prisma.PostFindFirstArgs>(query?: Prisma.SelectSubset<T, Prisma.PostFindFirstArgs>) {
    return this.client.post.findFirst(query);
  }

  findById(id: number) {
    return this.client.post.findFirst({
      where: {
        id,
      },
    });
  }

  create(newPost: Prisma.PostCreateInput) {
    return this.client.post.create({
      data: newPost,
    });
  }

  update(id: number, updatePost: Prisma.PostUpdateInput) {
    return this.client.post.update({
      data: updatePost,
      where: {
        id,
      },
    });
  }

  delete(id: number) {
    return this.client.post.delete({
      where: {
        id,
      },
    });
  }
}
