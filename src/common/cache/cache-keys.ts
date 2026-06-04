import { createHash } from 'crypto';
import { Request } from 'express';

const hashValue = (value: string): string => {
  return createHash('sha256').update(value).digest('hex');
};

const normalizedUrl = (req: Request): string => {
  return `${req.method}:${req.originalUrl}`;
};

export const CacheKeys = {
  productList: (req: Request): string => {
    return `cloudmart:products:list:${hashValue(normalizedUrl(req))}`;
  },

  productDetail: (productId: string): string => {
    return `cloudmart:products:detail:${productId}`;
  },

  categoryList: (req: Request): string => {
    return `cloudmart:categories:list:${hashValue(normalizedUrl(req))}`;
  },

  categoryDetail: (categoryId: string): string => {
    return `cloudmart:categories:detail:${categoryId}`;
  },

  patterns: {
    allProductLists: 'cloudmart:products:list:*',
    allProductDetails: 'cloudmart:products:detail:*',
    allCategories: 'cloudmart:categories:*',
  },
};
