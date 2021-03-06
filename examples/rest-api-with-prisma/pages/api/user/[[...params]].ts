import { UserRepository } from 'lib/repositories/user.repository';
import { Delete, Get, NextApiContext, Post, Put, UseMiddleware, withController } from 'next-controllers';
import common from 'lib/middlewares/common';

@UseMiddleware(...common)
class UserController {
  private readonly userRepository = new UserRepository();

  @Get()
  async getUsers({ request }: NextApiContext) {
    if (request.query.email) {
      const email = String(request.query.email);
      const user = await this.userRepository.findByEmail(email);
      return user;
    }

    const users = await this.userRepository.find();
    return users;
  }

  @Get('/:id')
  async getUserById({ request }: NextApiContext) {
    const user = await this.userRepository.findById(Number(request.params.id));
    return user;
  }

  @Post()
  async createUser({ request }: NextApiContext) {
    const user = await this.userRepository.create(request.body);
    return user;
  }

  @Put()
  async updateUser({ request }: NextApiContext) {
    const id = Number(request.params.id);
    const user = await this.userRepository.update(id, request.body);
    return user;
  }

  @Delete('/:id')
  async deleteUser({ request }: NextApiContext) {
    const id = Number(request.params.id);
    const user = await this.userRepository.delete(id);
    return user;
  }
}

export default withController(UserController);
