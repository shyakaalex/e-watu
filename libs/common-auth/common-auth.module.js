"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonAuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const jwt_strategy_1 = require("./jwt.strategy");
const roles_guard_1 = require("./roles.guard");
let CommonAuthModule = class CommonAuthModule {
};
exports.CommonAuthModule = CommonAuthModule;
exports.CommonAuthModule = CommonAuthModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, passport_1.PassportModule.register({ defaultStrategy: 'jwt' })],
        providers: [core_1.Reflector, jwt_strategy_1.JwtStrategy, roles_guard_1.RolesGuard],
        exports: [passport_1.PassportModule, core_1.Reflector, roles_guard_1.RolesGuard],
    })
], CommonAuthModule);
//# sourceMappingURL=common-auth.module.js.map