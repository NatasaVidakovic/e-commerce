using API.Extensions;
using Core.Configuration;
using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace API.Controllers;

public class AccountController(
    SignInManager<AppUser> signInManager,
    IOptions<AppSettings> appSettings,
    ILogger<AccountController> _logger,
    IEmailService emailService) : BaseApiController
{
    #region Forgot / Reset Password

    [EnableRateLimiting("auth")]
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        var user = await signInManager.UserManager.FindByEmailAsync(dto.Email);

        if (user == null)
        {
            // Don't reveal that the user doesn't exist
            return Ok(new { message = "If that email is registered, a reset link has been sent." });
        }

        // Check if this is a Google-only account (has external login but no password)
        var logins = await signInManager.UserManager.GetLoginsAsync(user);
        var hasPassword = await signInManager.UserManager.HasPasswordAsync(user);

        if (logins.Any(l => l.LoginProvider == "Google") && !hasPassword)
        {
            return BadRequest(new { code = "GoogleAccount", message = "This account uses Google login. Please use Google to sign in." });
        }

        var token = await signInManager.UserManager.GeneratePasswordResetTokenAsync(user);
        var resetLink = $"{appSettings.Value.FrontendUrl}/account/reset-password?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(token)}";

        await emailService.SendPasswordResetEmailAsync(user.Email!, resetLink, user.FirstName ?? "");

        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword(ResetPasswordDto dto)
    {
        var user = await signInManager.UserManager.FindByEmailAsync(dto.Email);

        if (user == null)
            return BadRequest(new { code = "InvalidResetRequest" });

        var result = await signInManager.UserManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Code).ToList();
            return BadRequest(new { code = "PasswordResetFailed", errors });
        }

        return Ok(new { code = "PasswordResetSuccess" });
    }

    #endregion

    [EnableRateLimiting("auth")]
    [HttpPost("login-with-feedback")]
    public async Task<ActionResult> LoginWithFeedback([FromBody] LoginDto dto)
    {
        var user = await signInManager.UserManager.FindByEmailAsync(dto.Email);

        if (user == null)
            return Unauthorized(new { code = "UserNotFound", message = "The email you entered is not registered." });

        // Check if Google-only account
        var logins = await signInManager.UserManager.GetLoginsAsync(user);
        var hasPassword = await signInManager.UserManager.HasPasswordAsync(user);

        if (logins.Any(l => l.LoginProvider == "Google") && !hasPassword)
            return Unauthorized(new { code = "GoogleAccount", message = "This account uses Google login. Please use Google to sign in." });

        var result = await signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return Unauthorized(new { code = "LockedOut", message = "Account is locked due to too many failed attempts. Try again later." });

        if (!result.Succeeded)
            return Unauthorized(new { code = "WrongPassword", message = "Incorrect password for this account." });

        await signInManager.SignInAsync(user, isPersistent: true);

        return Ok(new { email = user.Email, firstName = user.FirstName, lastName = user.LastName });
    }

    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<ActionResult> Register(RegisterDto registerDto)
    {
        var user = new AppUser
        {
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            Email = registerDto.Email,
            UserName = registerDto.Email
        };

        var result = await signInManager.UserManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(error.Code, error.Description);
            }

            return ValidationProblem();
        }

        return Ok();
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return NoContent();
    }

    [Authorize]
    [HttpGet("logout")]
    public async Task<ActionResult> LogoutGet()
    {
        await signInManager.SignOutAsync();
        return NoContent();
    }

    [HttpGet("user-info")]
    public async Task<ActionResult> GetUserInfo()
    {
        if (User.Identity?.IsAuthenticated == false) return NoContent();

        var user = await signInManager.UserManager.GetUserByEmailWithAddress(User);

        return Ok(new
        {
            user.FirstName,
            user.LastName,
            user.Email,
            Address = user.Address?.ToDto(),
            Roles = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    [HttpGet("auth-status")]
    public ActionResult GetAuthState()
    {
        return Ok(new
        {
            IsAuthenticated = User.Identity?.IsAuthenticated ?? false
        });
    }
    
    [Authorize]
    [HttpPost("address")]
    public async Task<ActionResult<Address>> CreateOrUpdateAddress(AddressDto addressDto)
    {
        var user = await signInManager.UserManager.GetUserByEmailWithAddress(User);

        if (user.Address == null)
        {
            user.Address = addressDto.ToEntity();
        }
        else
        {
            user.Address.UpdateFromDto(addressDto);
        }

        var result = await signInManager.UserManager.UpdateAsync(user);

        if (!result.Succeeded) return BadRequest("Problem updating user address");

        return Ok(user.Address.ToDto());
    }


    [HttpGet("google-login")]
    public async Task<IActionResult> Login(string returnUrl = null)
    {
        var redirectUrl = Url.Action(nameof(LoginResult), new { returnUrl });

        var properties = new AuthenticationProperties
        {
            RedirectUri = redirectUrl,
            Items =
                {
                    { "LoginProvider", "Google" },
                },
            AllowRefresh = true,
        };

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);

    }

    [HttpGet("google-complete")]
    public async Task<IActionResult> LoginResult(string returnUrl = null)
    {
        var returnUrlValue = returnUrl ?? "/";
        var baseUrl = appSettings.Value.FrontendUrl;

        _logger.LogInformation("=== Google OAuth Callback ===");
        _logger.LogInformation($"ReturnUrl parameter: {returnUrl}");
        _logger.LogInformation($"Final ReturnUrl: {returnUrlValue}");
        _logger.LogInformation($"BaseUrl: {baseUrl}");
        _logger.LogInformation($"Will redirect to: {baseUrl}{returnUrlValue}");
        
        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info == null) 
        {
            _logger.LogError("Error: External login info is null");
            return BadRequest("Error loading external login information");
        }
        
        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        _logger.LogInformation($"External login info received for provider: {info.LoginProvider}, email: {email}");

        var result = await signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("User successfully signed in with existing account");
            var user = await signInManager.UserManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
            
            if (user != null)
            {
                await signInManager.SignInAsync(user, isPersistent: false);
                _logger.LogInformation($"User {user.Email} signed in successfully");
                var redirectUrl = $"{baseUrl}{returnUrlValue}";
                _logger.LogInformation($"Redirecting to: {redirectUrl}");
                return Redirect(redirectUrl);
            }
        }


        // Handle first-time Google login - create user account
        _logger.LogInformation("Creating new user account from Google login");
        var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName);
        var lastName = info.Principal.FindFirstValue(ClaimTypes.Surname);

        _logger.LogInformation($"Creating user: {firstName} {lastName} ({email})");

        var newUser = new AppUser
        {
            Email = email,
            UserName = email,
            FirstName = firstName,
            LastName = lastName,
            EmailConfirmed = true
        };

        var createResult = await signInManager.UserManager.CreateAsync(newUser);
        if (!createResult.Succeeded) 
        {
            _logger.LogError($"Failed to create user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            return BadRequest("Problem creating user account");
        }

        await signInManager.UserManager.AddToRoleAsync(newUser, "Customer");

        var loginResult = await signInManager.UserManager.AddLoginAsync(newUser, info);
        if (!loginResult.Succeeded) 
        {
            _logger.LogError($"Failed to add external login: {string.Join(", ", loginResult.Errors.Select(e => e.Description))}");
            return BadRequest("Problem adding external login");
        }

        await signInManager.SignInAsync(newUser, isPersistent: false);
        _logger.LogInformation("New user successfully created and signed in");

        return Redirect($"{baseUrl}{returnUrlValue}");
    }
}