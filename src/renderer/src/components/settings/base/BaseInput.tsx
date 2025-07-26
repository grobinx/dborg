
export interface BaseInputProps {
    id: string;
    value: any;
    onChange: (e: any, value: any, ...args: any[]) => void;
    onClick?: () => void; 
    disabled: boolean;
}
