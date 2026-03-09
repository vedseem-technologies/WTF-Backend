import mongoose from 'mongoose';

export const paginate = async (model, query = {}, options = {}) => {
  const { limit = 10, cursor = null, direction = 'next', sort = { createdAt: -1 } } = options;
  const limits = parseInt(limit, 10);

  // Ensure consistent sorting
  const sortInfo = Object.entries(sort)[0] || ['createdAt', -1];
  const [sortField, sortOrder] = sortInfo;
  const isDesc = sortOrder === -1 || sortOrder === 'desc';

  // Build cursor query
  let cursorQuery = { ...query };

  if (cursor) {
    try {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf8');
      const lastUnderscore = decodedCursor.lastIndexOf('_');

      if (lastUnderscore !== -1) {
        const cursorValueStr = decodedCursor.substring(0, lastUnderscore);
        const cursorIdStr = decodedCursor.substring(lastUnderscore + 1);

        // Cast ID correctly
        let cursorId;
        try {
          cursorId = new mongoose.Types.ObjectId(cursorIdStr);
        } catch (idErr) {
          console.warn('Invalid ID in cursor:', cursorIdStr);
          throw idErr;
        }

        const operator = direction === 'next'
          ? (isDesc ? '$lt' : '$gt')
          : (isDesc ? '$gt' : '$lt');

        const secondaryOperator = direction === 'next'
          ? (isDesc ? '$lt' : '$gt')
          : (isDesc ? '$gt' : '$lt');

        let val = cursorValueStr;
        // If sorting by a date field, ensure we compare as Date objects
        if (sortField === 'createdAt' || sortField === 'updatedAt') {
          val = new Date(cursorValueStr);
        }

        const paginationFilter = sortField === '_id'
          ? { _id: { [operator]: cursorId } }
          : {
            $or: [
              { [sortField]: { [operator]: val } },
              {
                [sortField]: val,
                _id: { [secondaryOperator]: cursorId }
              }
            ]
          };

        // Combine with existing query using $and to avoid overwriting existing $or filters
        cursorQuery = { $and: [query, paginationFilter] };
      }
    } catch (e) {
      console.warn('Invalid or incompatible cursor:', e.message);
      // Fallback: just return first page if cursor is mangled
      cursorQuery = { ...query };
    }
  }

  // Determine actual DB sort order
  const dbSortOrder = direction === 'next' ? sortOrder : (isDesc ? 1 : -1);

  // Fetch data + 1 to check if there is a next page
  const data = await model.find(cursorQuery)
    .sort({ [sortField]: dbSortOrder, _id: dbSortOrder })
    .limit(limits + 1)
    .lean();

  const hasMore = data.length > limits;
  let results = hasMore ? data.slice(0, limits) : data;

  // If we fetched reverse (prev), flip back to requested order
  if (direction === 'prev') {
    results.reverse();
  }

  // Calculate Next/Prev Cursors
  let nextCursor = null;
  let prevCursor = null;

  if (results.length > 0) {
    const firstItem = results[0];
    const lastItem = results[results.length - 1];

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
    hasPrevPage = !!cursor;
  } else if (direction === 'prev') {
    hasNextPage = true;
    hasPrevPage = hasMore;
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
