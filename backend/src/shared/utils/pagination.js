export const getPagination = (page = 1, limit = 20) => {
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNumber - 1) * limitNumber;

  return {
    page: pageNumber,
    limit: limitNumber,
    offset,
  };
};

export const getPaginationMeta = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    limit,
    totalItems,
    totalPages,
  };
};
