import Image from 'next/image';

export interface LogoIconProps {
  className?: string;
  assetPath: string;
  size?: number;
}

export const LogoIcon = ({
  assetPath,
  className,
  size = 40,
}: LogoIconProps) => {
  return (
    <Image
      className={className}
      width={size}
      height={size}
      src={assetPath}
      alt="Logo"
    />
  );
};
