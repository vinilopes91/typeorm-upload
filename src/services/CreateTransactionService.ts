import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    category,
    title,
    type,
    value,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const balance = await transactionRepository.getBalance();

    if (type !== 'outcome' && type !== 'income') {
      throw new AppError('Wrong type');
    }

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('Insufficient Funds');
    }

    const categoryMatched = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryMatched) {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);

      const transaction = transactionRepository.create({
        category_id: newCategory.id,
        title,
        type,
        value,
      });

      await transactionRepository.save(transaction);

      return transaction;
    }

    const transaction = transactionRepository.create({
      category_id: categoryMatched.id,
      title,
      type,
      value,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
