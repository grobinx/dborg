
export interface BaseInputProps {
    id: string;
    value: any;
    onChange: (value: any, ...args: any[]) => void;
    onClick?: () => void; 
    disabled: boolean;
}
