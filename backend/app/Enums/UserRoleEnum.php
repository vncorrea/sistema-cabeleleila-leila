<?php

namespace App\Enums;

enum UserRoleEnum: string
{
    case Admin = 'admin';
    case Professional = 'professional';
    case Receptionist = 'receptionist';
}
