const express = require('express');
const router = express.Router();

const {
  catchAsync
} = require('../middleware')

const {
  deleteNotification
} = require("../controllers/notification");

router.delete('/:id', catchAsync(deleteNotification));

module.exports = router;