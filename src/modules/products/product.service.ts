import { Prisma, ProductStatus, VendorStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  buildPaginationMeta,
  getPagination,
} from '../../common/utils/pagination';
import { createSlug } from '../../common/utils/slug';
import {
  CreateProductInput,
  ListAdminProductsQuery,
  ListPublicProductsQuery,
  ListVendorProductsQuery,
  UpdateProductInput,
  UpdateProductStatusInput,
} from './product.validation';
import { productRepository, ProductWithRelations } from './product.repository';

type ProductResponse = {
  id: string;
  vendorId: string;
  categoryId: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  vendor: {
    id: string;
    name: string;
    email: string;
    storeName: string | null;
    storeSlug: string | null;
    vendorStatus: VendorStatus | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: {
    id: string;
    url: string;
    altText: string | null;
    sortOrder: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

const toProductResponse = (product: ProductWithRelations): ProductResponse => {
  return {
    id: product.id,
    vendorId: product.vendorId,
    categoryId: product.categoryId,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
    vendor: {
      id: product.vendor.id,
      name: product.vendor.name,
      email: product.vendor.email,
      storeName: product.vendor.vendorProfile?.storeName ?? null,
      storeSlug: product.vendor.vendorProfile?.slug ?? null,
      vendorStatus: product.vendor.vendorProfile?.status ?? null,
    },
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const ensureCategoryExists = async (
  categoryId?: string | null,
): Promise<void> => {
  if (!categoryId) {
    return;
  }

  const category = await productRepository.findCategoryById(categoryId);

  if (!category) {
    throw new AppError({
      message: 'Category not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }
};

const ensureApprovedVendor = async (vendorUserId: string): Promise<void> => {
  const vendorProfile =
    await productRepository.findVendorProfileByUserId(vendorUserId);

  if (!vendorProfile) {
    throw new AppError({
      message: 'Vendor profile not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  if (vendorProfile.status !== VendorStatus.APPROVED) {
    throw new AppError({
      message: 'Vendor account is not approved',
      statusCode: 403,
      code: ErrorCodes.VENDOR_NOT_APPROVED,
    });
  }
};

const ensureUniqueVendorSlug = async ({
  vendorId,
  slug,
  currentProductId,
}: {
  vendorId: string;
  slug: string;
  currentProductId?: string;
}): Promise<void> => {
  const existingProduct = await productRepository.findProductByVendorAndSlug({
    vendorId,
    slug,
  });

  if (existingProduct && existingProduct.id !== currentProductId) {
    throw new AppError({
      message: 'Product title is already used by this vendor',
      statusCode: 409,
      code: ErrorCodes.CONFLICT,
    });
  }
};

const assertVendorOwnsProduct = ({
  product,
  vendorId,
}: {
  product: ProductWithRelations | null;
  vendorId: string;
}): ProductWithRelations => {
  if (!product || product.vendorId !== vendorId) {
    throw new AppError({
      message: 'Product not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  return product;
};

const buildSearchWhere = (
  search?: string,
): Prisma.ProductWhereInput | undefined => {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ],
  };
};

const buildPriceWhere = ({
  minPrice,
  maxPrice,
}: {
  minPrice?: number;
  maxPrice?: number;
}): Prisma.DecimalFilter | undefined => {
  if (minPrice === undefined && maxPrice === undefined) {
    return undefined;
  }

  return {
    gte: minPrice !== undefined ? new Prisma.Decimal(minPrice) : undefined,
    lte: maxPrice !== undefined ? new Prisma.Decimal(maxPrice) : undefined,
  };
};

const buildProductOrderBy = ({
  sortBy,
  sortOrder,
}: {
  sortBy: 'createdAt' | 'price' | 'title';
  sortOrder: 'asc' | 'desc';
}): Prisma.ProductOrderByWithRelationInput => {
  if (sortBy === 'price') {
    return {
      price: sortOrder,
    };
  }

  if (sortBy === 'title') {
    return {
      title: sortOrder,
    };
  }

  return {
    createdAt: sortOrder,
  };
};

export const productService = {
  listPublicProducts: async (query: ListPublicProductsQuery) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      categoryId: query.categoryId,
      vendorId: query.vendorId,
      price: buildPriceWhere({
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
      }),
      ...buildSearchWhere(query.search),
    };

    const [products, total] = await Promise.all([
      productRepository.listProducts({
        where,
        orderBy: buildProductOrderBy({
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        }),
        skip,
        take,
      }),
      productRepository.countProducts(where),
    ]);

    return {
      products: products.map(toProductResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  getPublicProductById: async (id: string): Promise<ProductResponse> => {
    const product = await productRepository.findProductById(id);

    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new AppError({
        message: 'Product not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    return toProductResponse(product);
  },

  createVendorProduct: async ({
    vendorId,
    input,
  }: {
    vendorId: string;
    input: CreateProductInput;
  }): Promise<ProductResponse> => {
    await ensureApprovedVendor(vendorId);
    await ensureCategoryExists(input.categoryId);

    const slug = createSlug(input.title);

    await ensureUniqueVendorSlug({
      vendorId,
      slug,
    });

    const product = await productRepository.createProduct({
      vendorId,
      input,
      slug,
    });

    return toProductResponse(product);
  },

  listVendorProducts: async ({
    vendorId,
    query,
  }: {
    vendorId: string;
    query: ListVendorProductsQuery;
  }) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.ProductWhereInput = {
      vendorId,
      status: query.status,
      ...buildSearchWhere(query.search),
    };

    const [products, total] = await Promise.all([
      productRepository.listProducts({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      productRepository.countProducts(where),
    ]);

    return {
      products: products.map(toProductResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  updateVendorProduct: async ({
    vendorId,
    productId,
    input,
  }: {
    vendorId: string;
    productId: string;
    input: UpdateProductInput;
  }): Promise<ProductResponse> => {
    await ensureApprovedVendor(vendorId);

    const existingProduct = await productRepository.findProductById(productId);

    const ownedProduct = assertVendorOwnsProduct({
      product: existingProduct,
      vendorId,
    });

    await ensureCategoryExists(input.categoryId);

    const updateData: Prisma.ProductUpdateInput = {};

    if (input.title) {
      const slug = createSlug(input.title);

      await ensureUniqueVendorSlug({
        vendorId,
        slug,
        currentProductId: ownedProduct.id,
      });

      updateData.title = input.title;
      updateData.slug = slug;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.price !== undefined) {
      updateData.price = new Prisma.Decimal(input.price);
    }

    if (input.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = input.lowStockThreshold;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.categoryId !== undefined) {
      updateData.category = input.categoryId
        ? {
            connect: {
              id: input.categoryId,
            },
          }
        : {
            disconnect: true,
          };
    }

    const updatedProduct = await productRepository.updateProduct({
      id: productId,
      data: updateData,
    });

    return toProductResponse(updatedProduct);
  },

  archiveVendorProduct: async ({
    vendorId,
    productId,
  }: {
    vendorId: string;
    productId: string;
  }): Promise<ProductResponse> => {
    await ensureApprovedVendor(vendorId);

    const product = await productRepository.findProductById(productId);

    assertVendorOwnsProduct({
      product,
      vendorId,
    });

    const archivedProduct = await productRepository.archiveProduct(productId);

    return toProductResponse(archivedProduct);
  },

  listProductsForAdmin: async (query: ListAdminProductsQuery) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.ProductWhereInput = {
      status: query.status,
      vendorId: query.vendorId,
      ...buildSearchWhere(query.search),
    };

    const [products, total] = await Promise.all([
      productRepository.listProducts({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      productRepository.countProducts(where),
    ]);

    return {
      products: products.map(toProductResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  updateProductStatusForAdmin: async ({
    productId,
    input,
  }: {
    productId: string;
    input: UpdateProductStatusInput;
  }): Promise<ProductResponse> => {
    const product = await productRepository.findProductById(productId);

    if (!product) {
      throw new AppError({
        message: 'Product not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    const updatedProduct = await productRepository.updateProductStatus({
      id: productId,
      status: input.status,
    });

    return toProductResponse(updatedProduct);
  },
};
