interface QueryStringObject {
  [prop: string]: any;
}

class APIFeatures {
  query: any;

  queryString: QueryStringObject;

  constructor(query: any, queryString: QueryStringObject) {
    this.query = query;
    this.queryString = queryString;
    console.log(queryString);
  }

  filter() {
    //1-a)Filtering

    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1-b)Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b((gte|gt|lte|lt)\b)/g,
      (match) => `$${match}`
    );
    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    //2) Sorting
    if (this.queryString.sort) {
      //Tour.find() will return a query so we can chain another method to it
      const sortBy = this.queryString.sort;
      this.query = this.query.sort(sortBy + ' _id');
    }
    return this;
  }

  limitFields() {
    //3)Field Limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      //exclude the version
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    //4) Pagination
    if (this.queryString.page && this.queryString.limit) {
      const page = this.queryString.page * 1;
      const limit = this.queryString.limit * 1;
      const skip = (page - 1) * limit;

      //page=2&limit=10 1-11 page 1, 11-20 page 2, 21-30 page 3
      //in this case we will skip 2 documents and with show only 10

      this.query = this.query.skip(skip).limit(limit);
    }
    return this;
  }
}

export default APIFeatures;
