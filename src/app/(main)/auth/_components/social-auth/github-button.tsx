import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/ui/shadcn/simple-icon";
import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

export function GithubButton({ className, ...props }: React.ComponentProps<typeof Button>) {
    return (
        <Button variant="secondary" className={cn(className)} {...props}>
            <SimpleIcon icon={siGithub} className="size-4" />
            Continue with GitHub
        </Button>
    );
}
