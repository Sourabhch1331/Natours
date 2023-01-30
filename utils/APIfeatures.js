
class APIfeatures{
    constructor(query,queryString){
        this.query=query;
        this.queryString=queryString;
    }

    // Methods...
    filter(){
        const queryObj={...this.queryString};
        const exclidedFields=['page','sort','limit','fields'];
        exclidedFields.forEach(elem => delete queryObj[elem]);
        
        let queryStr = JSON.stringify (queryObj);
        queryStr=queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        const queryWithFilter=JSON.parse(queryStr);
    

        this.query=this.query.find(queryWithFilter);
        
        return this;
    }

    sort(){
        if(this.queryString.sort){
            this.query=this.query.sort(this.queryString.sort.split(',').join(' '));
        }else{
            this.query=this.query.sort('-createdTour')
        }
        return this;
    }

    limitField(){
        if(this.queryString.fields){
            if(this.queryString.fields.includes('password')){
                throw new AppError('Password fiels not allowed on query!',400);
            }
            const fields=this.queryString.fields.split(',').join(' ');
    
            this.query=this.query.select(fields);
        }else{
            this.query=this.query.select('-__v');
        }
        
        return this;
    }

    paginate(){
        const page=this.queryString.page*1 || 1;
        const limit=this.queryString.limit*1 || 100;
        const skipVal=(page-1)*limit;

        this.query=this.query.skip(skipVal).limit(limit);

        return this;
    }
}

module.exports= APIfeatures;