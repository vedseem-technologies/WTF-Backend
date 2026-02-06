export const paginate = async (model, query = {}, options = {}) => {
  const { limit = 10, cursor = null, direction = 'next', sort = { createdAt: -1 } } = options;
  const limits = parseInt(limit, 10);

  // Ensure consistent sorting
  // If sorting by createdAt, we need a secondary sort field (_id) for tie-breaking
  const sortInfo = Object.entries(sort)[0] || ['createdAt', -1];
  const [sortField, sortOrder] = sortInfo;
  const isDesc = sortOrder === -1 || sortOrder === 'desc';

  // Build cursor query
  let cursorQuery = { ...query };

  if (cursor) {
    try {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
      const [cursorValue, cursorId] = decodedCursor.split('_');

      const operator = direction === 'next'
        ? (isDesc ? '$lt' : '$gt')
        : (isDesc ? '$gt' : '$lt');

      const secondaryOperator = direction === 'next'
        ? (isDesc ? '$lt' : '$gt')
        : (isDesc ? '$gt' : '$lt');

      if (sortField === '_id') {
        cursorQuery._id = { [operator]: cursorValue };
      } else {
        // Compound cursor logic: (field < val) OR (field == val AND _id < id)
        // For 'prev' direction with DESC sort, it becomes (field > val) OR (field == val AND _id > id)
        cursorQuery.$or = [
          { [sortField]: { [operator]: cursorValue } },
          {
            [sortField]: cursorValue,
            _id: { [secondaryOperator]: cursorId }
          }
        ];
      }
    } catch (e) {
      // Invalid cursor, ignore or throw? For robustness, let's ignore and plain fetch (or could return empty)
      console.warn('Invalid cursor:', e);
    }
  }

  // Fetch data + 1 to check if there is a next page
  const data = await model.find(cursorQuery)
    .sort({ [sortField]: sortOrder, _id: sortOrder }) // Always tie-break with _id
    .limit(limits + 1)
    .lean();

  const hasMore = data.length > limits;
  const results = hasMore ? data.slice(0, limits) : data;

  // Calculate generic Next/Prev Cursors
  let nextCursor = null;
  let prevCursor = null;

  if (results.length > 0) {
    const lastItem = results[results.length - 1];
    const firstItem = results[0];

    // Helper to encode cursor
    const encodeCursor = (doc) => {
      const val = doc[sortField] instanceof Date ? doc[sortField].toISOString() : doc[sortField];
      return Buffer.from(`${val}_${doc._id}`).toString('base64');
    };

    nextCursor = encodeCursor(lastItem);
    prevCursor = encodeCursor(firstItem);
  }

  let hasNextPage = false;
  let hasPrevPage = false;

  if (direction === 'next') {
    hasNextPage = hasMore;
    hasPrevPage = !!cursor; // If we have a cursor in 'next', we have history
  } else if (direction === 'prev') {
    hasNextPage = true; // If we went back, we definitely have a 'next' (where we came from)
    hasPrevPage = hasMore; // If we found more items backwards, we have even deeper history
  }

  return {
    data: results,
    pageInfo: {
      nextCursor,
      prevCursor,
      hasNextPage,
      hasPrevPage
    }
  };
};
