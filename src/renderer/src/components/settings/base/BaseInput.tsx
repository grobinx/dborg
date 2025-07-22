
export interface BaseInputProps {
    id: string;
    value: any;
    onChange: (value: any) => void;
    onClick?: () => void; 
    disabled: boolean;
}
