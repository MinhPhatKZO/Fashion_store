const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    discountPercent: {
      type: Number,
      required: true,
      min: [0, 'Giảm giá phải >= 0%'],
      max: [100, 'Giảm giá phải <= 100%'],
    },
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc'],
    },
    endDate: {
      type: Date,
      required: [true, 'Ngày kết thúc là bắt buộc'],
      validate: {
        validator: function (value) {
          // endDate phải sau startDate
          return this.startDate < value;
        },
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // tự động thêm createdAt, updatedAt
  }
);

module.exports = mongoose.model('Promotion', promotionSchema);
