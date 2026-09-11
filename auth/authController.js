const {
    SESSION_DAYS, createAccount, authenticateUser, authenticateGoogleCredential,
    createSession, deleteSessionByToken, listUserSessions, revokeSession,
    revokeAllSessions, getPrivacyPreferences, updatePrivacyPreferences,
    requestPasswordReset, verifyPasswordResetCode, resetPasswordWithCode,
    getGoogleClientId,
    getUiPreferences,
    updateUiPreferences
} = require("./authService");
const { COOKIE_NAME } = require("./authMiddleware");
function isSecureEnvironment(){return process.env.NODE_ENV==="production"||String(process.env.RENDER||"").toLowerCase()==="true";}
function setSessionCookie(res,token){res.cookie(COOKIE_NAME,token,{httpOnly:true,secure:isSecureEnvironment(),sameSite:"lax",path:"/",maxAge:SESSION_DAYS*24*60*60*1000});}
function clearSessionCookie(res){res.clearCookie(COOKIE_NAME,{httpOnly:true,secure:isSecureEnvironment(),sameSite:"lax",path:"/"});}
async function signup(req,res){try{const {name,email,password,preferredLanguage,acceptTerms,acceptPrivacy}=req.body||{};const user=await createAccount({name,email,password,preferredLanguage,acceptTerms,acceptPrivacy});const session=await createSession(user.userId,req.get("user-agent"));setSessionCookie(res,session.token);res.status(201).json({success:true,user});}catch(error){if(error.code==="VALIDATION_ERROR"||error.code==="CONSENT_REQUIRED")return res.status(400).json({success:false,message:error.message});if(error.code==="EMAIL_EXISTS")return res.status(409).json({success:false,message:error.message});console.error("SIGNUP ERROR:",error);res.status(500).json({success:false,message:"Could not create account."});}}
async function login(req,res){try{const {email,password}=req.body||{};const user=await authenticateUser(email,password);if(!user)return res.status(401).json({success:false,message:"Invalid email or password."});const session=await createSession(user.userId,req.get("user-agent"));setSessionCookie(res,session.token);res.json({success:true,user});}catch(error){console.error("LOGIN ERROR:",error);res.status(500).json({success:false,message:"Could not sign in."});}}
async function googleLogin(req,res){try{const user=await authenticateGoogleCredential(req.body?.credential,{acceptTerms:req.body?.acceptTerms,acceptPrivacy:req.body?.acceptPrivacy});const session=await createSession(user.userId,req.get("user-agent"));setSessionCookie(res,session.token);res.json({success:true,user});}catch(error){if(["VALIDATION_ERROR","GOOGLE_IDENTITY_INVALID","CONSENT_REQUIRED"].includes(error.code))return res.status(400).json({success:false,message:error.message});if(error.code==="GOOGLE_LINK_CONFLICT")return res.status(409).json({success:false,message:error.message});if(error.code==="GOOGLE_NOT_CONFIGURED")return res.status(503).json({success:false,message:error.message});console.error("GOOGLE LOGIN ERROR:",error);res.status(401).json({success:false,message:"Google sign-in could not be verified."});}}
function googleConfig(req,res){const clientId=getGoogleClientId();res.json({success:true,clientId:clientId||null,enabled:Boolean(clientId)});}
async function forgotPassword(req,res){try{await requestPasswordReset(req.body?.email);res.json({success:true,message:"If an Aman AI account exists for that email, a verification code has been sent."});}catch(error){if(error.code==="EMAIL_NOT_CONFIGURED")return res.status(503).json({success:false,message:"Email recovery is not configured yet. You can still use Continue with Google if your account uses the same email."});console.error("FORGOT PASSWORD ERROR:",error);res.status(500).json({success:false,message:"Could not send the password reset email."});}}
async function verifyResetCode(req,res){try{const valid=await verifyPasswordResetCode(req.body?.email,req.body?.code);if(!valid)return res.status(400).json({success:false,message:"That code is invalid or has expired."});res.json({success:true});}catch(error){console.error("VERIFY RESET CODE ERROR:",error);res.status(500).json({success:false,message:"Could not verify the code."});}}
async function resetPassword(req,res){try{const reset=await resetPasswordWithCode(req.body?.email,req.body?.code,req.body?.newPassword);if(!reset)return res.status(400).json({success:false,message:"That code is invalid or has expired."});clearSessionCookie(res);res.json({success:true,message:"Password changed. Sign in with your new password."});}catch(error){if(error.code==="VALIDATION_ERROR")return res.status(400).json({success:false,message:error.message});console.error("RESET PASSWORD ERROR:",error);res.status(500).json({success:false,message:"Could not reset the password."});}}
async function logout(req,res){try{await deleteSessionByToken(req.sessionToken);clearSessionCookie(res);res.json({success:true});}catch(error){console.error("LOGOUT ERROR:",error);clearSessionCookie(res);res.json({success:true});}}
function me(req,res){res.json({success:true,user:{userId:req.auth.userId,email:req.auth.email,displayName:req.auth.displayName,preferredLanguage:req.auth.preferredLanguage,hasPassword:req.auth.hasPassword,googleLinked:req.auth.googleLinked}});}
async function sessions(req,res){try{const rows=await listUserSessions(req.auth.userId,req.auth.sessionId);res.json({success:true,sessions:rows});}catch(error){console.error("SESSION LIST ERROR:",error);res.status(500).json({success:false,message:"Could not load sessions."});}}
async function removeSession(req,res){try{const sessionId=String(req.params.sessionId||"");const removed=await revokeSession(req.auth.userId,sessionId);if(!removed)return res.status(404).json({success:false,message:"Session not found."});if(sessionId===req.auth.sessionId)clearSessionCookie(res);res.json({success:true,currentSessionRevoked:sessionId===req.auth.sessionId});}catch(error){console.error("SESSION REVOKE ERROR:",error);res.status(500).json({success:false,message:"Could not revoke session."});}}
async function logoutAll(req,res){try{await revokeAllSessions(req.auth.userId);clearSessionCookie(res);res.json({success:true});}catch(error){console.error("LOGOUT ALL ERROR:",error);res.status(500).json({success:false,message:"Could not sign out of all sessions."});}}
async function privacyPreferences(req,res){try{const preferences=await getPrivacyPreferences(req.auth.userId);res.json({success:true,preferences});}catch(error){console.error("PRIVACY PREFS ERROR:",error);res.status(500).json({success:false,message:"Could not load privacy settings."});}}
async function savePrivacyPreferences(req,res){try{const preferences=await updatePrivacyPreferences(req.auth.userId,{lockOnHidden:req.body?.lockOnHidden,autoLogoutMinutes:req.body?.autoLogoutMinutes});res.json({success:true,preferences});}catch(error){if(error.code==="VALIDATION_ERROR")return res.status(400).json({success:false,message:error.message});console.error("SAVE PRIVACY PREFS ERROR:",error);res.status(500).json({success:false,message:"Could not save privacy settings."});}}
async function unlock(req,res){try{if(!req.auth.hasPassword)return res.status(400).json({success:false,message:"This Google-only account does not have a password. Sign out and use Continue with Google."});const password=req.body?.password;if(typeof password!=="string"||!password)return res.status(400).json({success:false,message:"Enter your password."});const user=await authenticateUser(req.auth.email,password);if(!user)return res.status(401).json({success:false,message:"Incorrect password."});res.json({success:true});}catch(error){console.error("UNLOCK ERROR:",error);res.status(500).json({success:false,message:"Could not unlock Aman AI."});}}

async function uiPreferences(req, res) {
    try {
        const preferences = await getUiPreferences(req.auth.userId);
        res.json({ success: true, preferences });
    } catch (error) {
        console.error("UI PREFERENCES ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Could not load appearance settings."
        });
    }
}

async function saveUiPreferences(req, res) {
    try {
        const preferences = await updateUiPreferences(
            req.auth.userId,
            req.body || {}
        );

        res.json({ success: true, preferences });
    } catch (error) {
        console.error("SAVE UI PREFERENCES ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Could not save appearance settings."
        });
    }
}

module.exports = {
    uiPreferences,
    saveUiPreferences,signup,login,googleLogin,googleConfig,forgotPassword,verifyResetCode,resetPassword,logout,me,sessions,removeSession,logoutAll,privacyPreferences,savePrivacyPreferences,unlock};
