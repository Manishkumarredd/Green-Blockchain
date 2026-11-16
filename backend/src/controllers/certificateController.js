const certificateService = require("../services/certificateService");
const { sendSuccess } = require("../utils/responseHandler");

class CertificateController {
  async getCertificates(req, res, next) {
    try {
      const certs = await certificateService.getCertificates(req.user.id, req.user.role);
      return sendSuccess(res, certs, "Green certificates retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getCertificateById(req, res, next) {
    try {
      const cert = await certificateService.getCertificateById(req.params.id);
      return sendSuccess(res, cert, "Certificate details retrieved");
    } catch (err) {
      next(err);
    }
  }

  async verifyCertificate(req, res, next) {
    try {
      const verification = await certificateService.verifyCertificate(req.params.id);
      return sendSuccess(res, verification, "Certificate verification evaluated");
    } catch (err) {
      next(err);
    }
  }

  async issueCertificate(req, res, next) {
    try {
      const cert = await certificateService.issueCertificate({
        transactionId: req.body.transactionId,
        requestingUserId: req.user.id,
      });
      return sendSuccess(res, cert, "Green certificate issued successfully", 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CertificateController();
