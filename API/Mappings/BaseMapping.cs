using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace API.Mappings;

public abstract class BaseMapping<TDto, TEntity>
    where TDto:BaseDto
    where TEntity: IDtoConvertible
{
    public  abstract TDto ToDto( TEntity product);

    public abstract TEntity ToEntity(TDto productDto);
}
