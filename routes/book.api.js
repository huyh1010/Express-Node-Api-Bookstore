const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const router = express.Router();

/**
 * params: /
 * description: get all books
 * query:
 * method: get
 */

router.get("/", (req, res, next) => {
  const allowedFilter = [
    "author",
    "page",
    "limit",
    "country",
    "title",
    "language",
  ];

  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterKeys[key]) delete filterKeys[key];
    });

    let offset = limit * (page - 1);
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { books } = db;
    let results = [];

    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter((book) => book[condition] === filterQuery[condition])
          : books.filter((book) => book[condition] === filterQuery[condition]);
      });
    } else {
      result = books;
    }
    result = result.slice(offset, offset + limit);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  //post input validation
  try {
    const { author, country, imageLink, language, link, pages, title, year } =
      req.body;
    if (
      !author ||
      !country ||
      !imageLink ||
      !language ||
      !link ||
      !pages ||
      !title ||
      !year
    ) {
      const exception = new Error(`Missing body info!`);
      exception.statusCode = 401;
      throw exception;
    }

    const newBook = {
      author,
      country,
      imageLink,
      language,
      pages: parseInt(pages) || 1,
      title,
      year: parseInt(year) || 0,
      id: crypto.randomBytes(4).toString("hex"),
    };

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);

    const { books } = db;
    books.push(newBook);
    db.books = books;
    // db.books.push(newBook);

    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);

    res.status(200).send(newBook);
  } catch (error) {
    next(error);
  }
});

router.put("/:bookId", (req, res, next) => {
  try {
    const allowUpdate = [
      "author",
      "country",
      "imageLink",
      "language",
      "pages",
      "title",
      "year",
    ];
    const { bookId } = req.params;

    const updates = req.body;
    const updateKeys = Object.keys(updates);

    const notAllow = updateKeys.filter((key) => !allowUpdate.includes(key));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);

    const { books } = db;
    const targetIndex = books.findIndex((book) => book.id === bookId);

    if (targetIndex < 0) {
      const exception = new Error(`Book not found`);
      exception.statusCode = 404;
      throw exception;
    }

    const updatedBook = { ...db.books[targetIndex], ...updates };
    db.books[targetIndex] = updatedBook;

    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    res.status(200).send(updatedBook);
  } catch (error) {
    next(error);
  }
});

router.delete("/:bookId", (req, res, next) => {
  try {
    const { bookId } = req.params;
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);

    const { books } = db;
    const targetIndex = books.findIndex((book) => book.id === bookId);
    if (targetIndex < 0) {
      const exception = new Error(`Book not found`);
      exception.statusCode = 404;
      throw exception;
    }

    db.books = books.filter((book) => book.id !== bookId);

    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);

    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
