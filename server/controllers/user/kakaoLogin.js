const { user } = require("../../models");
require("dotenv").config();
const { generateAccessToken } = require("../tokenFunction/accessToken");
const {
  generateRefreshToken,
  sendRefreshToken,
} = require("../tokenFunction/refreshToken");
const axios = require("axios");
axios.defaults.withCredentials = true;

module.exports = {
  post: async (req, res) => {
    console.log("인증 코드 : ", req.body);
    const { authorizationCode } = req.body;
    const url = "https://kauth.kakao.com/oauth/token";
    const kakaoToken = await axios({
      method: "post",
      url: url,
      headers: {
        accept: "application/json",
      },
      data: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code: authorizationCode,
      },
    });
    console.log("카카오 토큰 : ", kakaoToken);
    //     {
    //     "token_type":"bearer",
    //     "access_token":"{ACCESS_TOKEN}",
    //     "expires_in":43199,
    //     "refresh_token":"{REFRESH_TOKEN}",
    //     "refresh_token_expires_in":25184000,
    //     "scope":"account_email profile"
    // }
    const kakaoUrl = `https://kapi.kakao.com/v2/user/me`;
    const userData = await axios({
      method: "get",
      url: kakaoUrl,
      headers: {
        Authorization: `Bearer ${kakaoToken.access_token}`,
        "Content-type": `application/x-www-form-urlencoded;charset=utf-8`,
      },
    });
    console.log("카카오 유저 데이터 : ", userData);
    const newUser = await user.create({
      email: userData.kakao_account.email,
      username: userData.kakao_account.profile.nickname,
      userPic: userData.kakao_account.profile.profile_image_url,
    });
    console.log("새로운 유저 : ", newUser);
    const accessToken = generateAccessToken(newUser.dataValues);
    const refreshToken = generateRefreshToken(newUser.dataValues);
    sendRefreshToken(res, refreshToken);
    res.status(201).json({
      accessToken: accessToken,
      userInfo: newUser.dataValues,
      message: "ok",
    });
  },
};
