import Image from 'next/image';

export interface LogoIconProps {
  className?: string;
  assetPath: string;
}

export const LogoIcon = ({ assetPath, className }: LogoIconProps) => {
  return <Image className={className} width={60} height={60} src={assetPath} alt="Logo" />;
};
