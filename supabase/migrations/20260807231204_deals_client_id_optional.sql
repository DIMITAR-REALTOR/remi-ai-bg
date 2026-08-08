-- client_id (платформен профил) вече е по избор - сделка може да е само с CRM клиент
ALTER TABLE public.deals ALTER COLUMN client_id DROP NOT NULL;
