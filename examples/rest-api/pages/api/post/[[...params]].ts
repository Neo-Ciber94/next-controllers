import { PostRepository } from 'lib/repositories/post.repository';
import morgan from 'morgan';
import { Delete, Get, NextApiContext, Post, Put, UseMiddleware, withController } from 'next-controllers';

@UseMiddleware(morgan('dev'))
class PostController {
  private readonly postRepository = new PostRepository();

  @Get()
  async getPosts() {
    const posts = await this.postRepository.find();
    return posts;
  }

  @Get('/:id')
  async getPostById({ request }: NextApiContext) {
    const post = await this.postRepository.findById(Number(request.params.id));
    return post;
  }

  @Post()
  async createPost({ request }: NextApiContext) {
    const post = await this.postRepository.create(request.body);
    return post;
  }

  @Put()
  async updatePost({ request }: NextApiContext) {
    const id = Number(request.params.id);
    const post = await this.postRepository.update(id, request.body);
    return post;
  }

  @Delete('/:id')
  async deletePost({ request }: NextApiContext) {
    const id = Number(request.params.id);
    const post = await this.postRepository.delete(id);
    return post;
  }
}

export default withController(PostController);
