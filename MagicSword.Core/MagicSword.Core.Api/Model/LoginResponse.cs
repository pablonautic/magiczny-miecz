﻿
namespace MagicSword.Core.Api.Model
{
    public class LoginResponse
    {
        public bool Success { get; set; }

        public string Token { get; set; }

        public string Error { get; set; }
    }
}
