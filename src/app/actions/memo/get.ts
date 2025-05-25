'use server';

import { ResultAsync } from 'neverthrow';

import { SerializableResult } from './types';
import { toSerializable } from './utils';
import { MemoRepository } from '../../../lib/db';
import { Memo } from '@/lib/prisma/types';

import * as fs from 'fs';
import * as path from 'path';

const showFiles = (folderName: string) => {
  const directoryPath = path.join(__dirname, folderName);

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    console.log('Files in directory:');
    files.forEach((file) => {
      console.log(folderName, file);
    });
  });
};

showFiles('../../../../node_modules/.prisma/client');
showFiles('../../../../../../vercel/path0/node_modules/@prisma/client');

/**
 * Get all memos (root level, no parent)
 *
 * @returns Serializable result containing an array of memos or an error
 */
export async function getMemos(): Promise<SerializableResult<Memo[]>> {
  // Execute the database operation using our MemoRepository
  const result = await ResultAsync.fromPromise(MemoRepository.findAll(), (error) => {
    console.error('Error fetching memos:', error);
    return {
      message: 'Failed to fetch memos',
      cause: error,
    };
  });

  // Convert ResultAsync to SerializableResult
  return toSerializable(result);
}
