import { UserRepository } from 'lib/repositories/user.repository';
import morgan from 'morgan';
import { NextApiResponse } from 'next';
import {
  Delete,
  Get,
  Middleware,
  NextApiContext,
  NextApiRequestWithParams,
  Post,
  Put,
  UseMiddleware,
  withController,
} from 'next-controllers';

const checkIfUserExists: Middleware<NextApiRequestWithParams, NextApiResponse> = async (req, res, next) => {
  if (req.params.id) {
    const id = Number(req.params.id);
    const user = await new UserRepository().findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
  }

  next();
};

const addTimeHeader: Middleware<NextApiRequestWithParams, NextApiResponse> = async (req, res, next) => {
  // res.setHeader('X-Time', new Date().toISOString());
  next();
};

@UseMiddleware(morgan('dev'), checkIfUserExists)
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
