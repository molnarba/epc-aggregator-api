import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType, ResolveTree } from 'graphql-parse-resolve-info';

export const OptionalArgs = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const info = GqlExecutionContext.create(ctx).getInfo();
  if (info) {
    const resolveFields = extractSimplifiedResolveFields(info);
    if (resolveFields[data]) {
      return resolveFields[data].args;
    }
  }
  return [];
});

function extractSimplifiedResolveFields(info: any) {
  const parsedResolveInfoFragment = parseResolveInfo(info);
  if (parsedResolveInfoFragment && instanceOfResolveTree(parsedResolveInfoFragment)) {
    const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType);
    return fields;
  }
  return {};
}

function instanceOfResolveTree(object: any): object is ResolveTree {
  return 'fieldsByTypeName' in object;
}
