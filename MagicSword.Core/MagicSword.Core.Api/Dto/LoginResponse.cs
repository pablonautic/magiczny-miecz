﻿
namespace MagicSword.Core.Api.Dto
{
    public class LoginResponse
    {
        public bool Success { get; set; }

        public string Token { get; set; }

        public string Error { get; set; }
    }
}
