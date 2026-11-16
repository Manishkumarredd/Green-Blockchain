const userService = require("../services/userService");
const { sendSuccess } = require("../utils/responseHandler");

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.id);
      return sendSuccess(res, user, "User profile retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updated = await userService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, updated, "Profile updated successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
