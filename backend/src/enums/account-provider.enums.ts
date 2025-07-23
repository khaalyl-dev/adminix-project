// Enum for account providers (e.g., Google, Facebook) used in authentication.
export const ProviderEnum = {
    GOOGLE:"GOOGLE",
    GITHUB:"GITHUB",
    FACEBOOK:"FACEBOOK",
    EMAIL:"EMAIL",    
};

export type ProviderEnumType = keyof typeof ProviderEnum;